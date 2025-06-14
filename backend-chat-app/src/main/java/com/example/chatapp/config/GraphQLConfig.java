package com.example.chatapp.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.graphql.server.WebGraphQlInterceptor;
import org.springframework.graphql.server.WebGraphQlRequest;
import org.springframework.graphql.server.WebGraphQlResponse;
import org.springframework.http.HttpHeaders;
import reactor.core.publisher.Mono;

@Configuration
public class GraphQLConfig {

    @Bean
    public WebGraphQlInterceptor corsInterceptor() {
        return new WebGraphQlInterceptor() {
            @Override
            public Mono<WebGraphQlResponse> intercept(WebGraphQlRequest request, Chain chain) {
                return chain.next(request).map(response -> {
                    response.getResponseHeaders().add("Access-Control-Allow-Origin", "http://localhost:4200");
                    response.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
                    response.getResponseHeaders().add("Access-Control-Allow-Headers", "*");
                    response.getResponseHeaders().add("Access-Control-Allow-Credentials", "true");
                    return response;
                });
            }
        };
    }
}
